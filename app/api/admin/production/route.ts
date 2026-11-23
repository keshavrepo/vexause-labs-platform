import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { enqueueJob } from "@/lib/jobs";
import { randomBytes } from "crypto";

const createSchema = z.object({ orderId: z.string().min(1) });
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("UPDATE"), jobId: z.string().min(1), status: z.enum(["QUEUED","PREPARATION","PRINTING","POST_PROCESSING","QUALITY_CHECK","PACKAGING","ON_HOLD","READY_FOR_DISPATCH"]).optional(), machineId: z.string().nullable().optional(), priority: z.enum(["LOW","NORMAL","HIGH","URGENT"]).optional(), dueAt: z.string().datetime().nullable().optional(), operatorNotes: z.string().max(2000).nullable().optional() }),
  z.object({ action: z.literal("MACHINE"), name: z.string().min(2).max(80), model: z.string().max(100).optional(), buildVolume: z.string().max(100).optional(), notes: z.string().max(500).optional() }),
  z.object({ action: z.literal("MATERIAL"), name: z.string().min(2).max(80), materialType: z.string().max(60).optional(), colour: z.string().max(60).optional(), stockGrams: z.number().int().min(0).max(10000000), reorderAtGrams: z.number().int().min(0).max(10000000) }),
  z.object({ action: z.literal("CONSUME"), jobId: z.string().min(1), materialId: z.string().min(1), quantityGrams: z.number().int().min(1).max(1000000), notes: z.string().max(500).optional() }),
  z.object({ action: z.literal("INSPECT"), jobId: z.string().min(1), checks: z.array(z.object({ key: z.enum(["surface","dimensions","fit","visual","quantity"]), passed: z.boolean(), note: z.string().max(300).optional() })).length(5), notes: z.string().max(1000).optional() }),
  z.object({ action: z.literal("READY"), jobId: z.string().min(1) }),
]);

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowStaff: true }); if (auth.response) return auth.response;
  const [jobs, machines, materials, eligibleOrders] = await Promise.all([
    prisma.productionJob.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "asc" }], include: {
      order: { select: { id: true, orderCode: true, kind: true, status: true, totalPaise: true, items: { select: { productName: true, quantity: true } }, payments: { where: { status: "VERIFIED" }, select: { amountPaise: true } } } },
      machine: true, lines: true, consumptions: { include: { material: { select: { name: true, colour: true } } } },
      inspections: { orderBy: { createdAt: "desc" }, take: 3 }
    }, take: 100 }),
    prisma.productionMachine.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.productionMaterial.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.order.findMany({ where: { status: { in: ["PAID", "IN_PRODUCTION"] }, productionJob: null }, orderBy: { createdAt: "asc" }, take: 100, select: { id: true, orderCode: true, kind: true, totalPaise: true, items: { select: { productName: true, quantity: true } } } })
  ]);
  return NextResponse.json({ jobs, machines, materials, eligibleOrders });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowStaff: true }); if (auth.response) return auth.response;
  try {
    const d = createSchema.parse(await request.json());
    const job = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id: d.orderId }, include: { items: true, productionJob: true } });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!["PAID", "IN_PRODUCTION"].includes(order.status)) throw new Error("ORDER_NOT_READY");
      if (order.productionJob) throw new Error("JOB_EXISTS");
      const created = await tx.productionJob.create({ data: {
        jobCode: `PR-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`,
        orderId: order.id,
        lines: { create: order.items.map(item => ({ orderItemId: item.id, productName: item.productName, quantity: item.quantity })) }
      } });
      await tx.auditLog.create({ data: { actorId: auth.session!.userId, action: "PRODUCTION_JOB_CREATED", entityType: "ProductionJob", entityId: created.id, metadata: { orderId: order.id } } });
      return created;
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    const code = e instanceof Error ? e.message : "";
    if (code === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (code === "ORDER_NOT_READY") return NextResponse.json({ error: "Only PAID or IN_PRODUCTION orders can enter the production queue." }, { status: 409 });
    if (code === "JOB_EXISTS") return NextResponse.json({ error: "A production job already exists for this order." }, { status: 409 });
    return NextResponse.json({ error: "Could not create production job." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowStaff: true }); if (auth.response) return auth.response;
  try {
    const d = actionSchema.parse(await request.json());
    if (d.action === "MACHINE") {
      const machine = await prisma.productionMachine.create({ data: { name: d.name.trim(), model: d.model?.trim(), buildVolume: d.buildVolume?.trim(), notes: d.notes?.trim() } });
      return NextResponse.json({ machine }, { status: 201 });
    }
    if (d.action === "MATERIAL") {
      const material = await prisma.productionMaterial.create({ data: { name: d.name.trim(), materialType: d.materialType?.trim(), colour: d.colour?.trim(), stockGrams: d.stockGrams, reorderAtGrams: d.reorderAtGrams } });
      return NextResponse.json({ material }, { status: 201 });
    }
    if (d.action === "CONSUME") {
      const result = await prisma.$transaction(async tx => {
        const job = await tx.productionJob.findUnique({ where: { id: d.jobId }, select: { id: true, status: true } });
        if (!job || ["READY_FOR_DISPATCH","COMPLETED","CANCELLED"].includes(job.status)) throw new Error("JOB_LOCKED");
        const changed = await tx.productionMaterial.updateMany({ where: { id: d.materialId, isActive: true, stockGrams: { gte: d.quantityGrams } }, data: { stockGrams: { decrement: d.quantityGrams } } });
        if (changed.count !== 1) throw new Error("MATERIAL_STOCK_LOW");
        return tx.materialConsumption.create({ data: { jobId: d.jobId, materialId: d.materialId, quantityGrams: d.quantityGrams, notes: d.notes?.trim() } });
      });
      return NextResponse.json({ consumption: result }, { status: 201 });
    }
    if (d.action === "INSPECT") {
      const passed = d.checks.every(c => c.passed);
      const result = await prisma.$transaction(async tx => {
        const job = await tx.productionJob.findUnique({ where: { id: d.jobId }, select: { id: true, status: true } });
        if (!job || !["QUALITY_CHECK","POST_PROCESSING"].includes(job.status)) throw new Error("QC_STAGE_REQUIRED");
        const inspection = await tx.qualityInspection.create({ data: { jobId: d.jobId, passed, checksJson: d.checks, notes: d.notes?.trim(), inspectedBy: auth.session!.userId } });
        await tx.productionJob.update({ where: { id: d.jobId }, data: { qcPassedAt: passed ? new Date() : null } });
        return inspection;
      });
      return NextResponse.json({ inspection: result }, { status: 201 });
    }
    if (d.action === "READY") {
      const result = await prisma.$transaction(async tx => {
        const job = await tx.productionJob.findUnique({ where: { id: d.jobId }, include: { order: { include: { payments: { where: { status: "VERIFIED" }, select: { amountPaise: true } }, refunds: { where: { status: "SUCCEEDED" }, select: { amountPaise: true } } } }, inspections: { orderBy: { createdAt: "desc" }, take: 1 } } });
        if (!job) throw new Error("JOB_NOT_FOUND");
        if (job.status !== "PACKAGING") throw new Error("PACKAGING_REQUIRED");
        if (!job.inspections[0]?.passed || !job.qcPassedAt) throw new Error("QC_NOT_PASSED");
        const captured = job.order.payments.reduce((sum, p) => sum + p.amountPaise, 0);
        const refunded = job.order.refunds.reduce((sum, r) => sum + r.amountPaise, 0);
        const paid = Math.max(0, captured - refunded);
        if (job.order.kind === "CUSTOM" && paid < job.order.totalPaise) throw new Error("CUSTOM_BALANCE_DUE");
        const updated = await tx.productionJob.update({ where: { id: d.jobId }, data: { status: "READY_FOR_DISPATCH", completedAt: new Date() } });
        if (job.order.status !== "READY_TO_SHIP") {
          const changed=await tx.order.updateMany({ where: { id: job.orderId, status: job.order.status }, data: { status: "READY_TO_SHIP" } });
          if(changed.count!==1)throw new Error("ORDER_STATE_CHANGED");
          await tx.orderStatusHistory.create({ data: { orderId: job.orderId, status: "READY_TO_SHIP", note: "Production complete; quality inspection passed.", actorId: auth.session!.userId } });
          await enqueueJob("ORDER_STATUS_NOTIFICATION",{userId:job.order.userId,title:"Order ready to ship",message:`Production and quality checks for ${job.order.orderCode} are complete. Your order is being prepared for dispatch.`,href:`/account/orders/${job.orderId}`},tx);
        }
        await tx.auditLog.create({ data: { actorId: auth.session!.userId, action: "PRODUCTION_READY_FOR_DISPATCH", entityType: "ProductionJob", entityId: job.id } });
        return updated;
      });
      return NextResponse.json({ job: result });
    }
    const result = await prisma.$transaction(async tx => {
      const job = await tx.productionJob.findUnique({ where: { id: d.jobId }, select: { id: true, status: true, orderId: true } });
      if (!job) throw new Error("JOB_NOT_FOUND");
      if (d.machineId) {
        const machine = await tx.productionMachine.findFirst({ where: { id: d.machineId, isActive: true }, select: { id: true } });
        if (!machine) throw new Error("MACHINE_NOT_FOUND");
      }
      const transitions: Record<string, string[]> = { QUEUED: ["PREPARATION","ON_HOLD"], PREPARATION: ["PRINTING","ON_HOLD"], PRINTING: ["POST_PROCESSING","ON_HOLD"], POST_PROCESSING: ["QUALITY_CHECK","ON_HOLD"], QUALITY_CHECK: ["POST_PROCESSING","PACKAGING","ON_HOLD"], PACKAGING: ["QUALITY_CHECK","ON_HOLD"], ON_HOLD: ["PREPARATION","PRINTING","POST_PROCESSING","QUALITY_CHECK","PACKAGING"] };
      if (d.status && d.status !== job.status && !(transitions[job.status] || []).includes(d.status)) throw new Error("INVALID_STAGE");
      if (d.status === "PRINTING" && d.status !== job.status) {
        const changed=await tx.order.updateMany({ where: { id: job.orderId, status: "PAID" }, data: { status: "IN_PRODUCTION" } });
        if(changed.count===1){
          await tx.orderStatusHistory.create({data:{orderId:job.orderId,status:"IN_PRODUCTION",note:"Production work has started.",actorId:auth.session!.userId}});
          const order=await tx.order.findUnique({where:{id:job.orderId},select:{userId:true,orderCode:true}});
          if(order)await enqueueJob("ORDER_STATUS_NOTIFICATION",{userId:order.userId,title:"Production started",message:`Production has started for your order ${order.orderCode}.`,href:`/account/orders/${job.orderId}`},tx);
        }
      }
      return tx.productionJob.update({ where: { id: job.id }, data: { ...(d.status ? { status: d.status } : {}), ...(d.machineId !== undefined ? { machineId: d.machineId } : {}), ...(d.priority ? { priority: d.priority } : {}), ...(d.dueAt !== undefined ? { dueAt: d.dueAt ? new Date(d.dueAt) : null } : {}), ...(d.operatorNotes !== undefined ? { operatorNotes: d.operatorNotes } : {}), ...(d.status === "PRINTING" ? { startedAt: new Date() } : {}) } });
    });
    return NextResponse.json({ job: result });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid production update." }, { status: 400 });
    const code = e instanceof Error ? e.message : "";
    const errors: Record<string, [number,string]> = {
      JOB_NOT_FOUND: [404,"Production job not found."], MACHINE_NOT_FOUND: [404,"Select an active registered machine."], JOB_LOCKED: [409,"Material cannot be consumed for a completed or dispatch-ready job."],
      MATERIAL_STOCK_LOW: [409,"Material stock is insufficient or the material is inactive."], QC_STAGE_REQUIRED: [409,"Inspection is available only during post-processing or quality check."],
      PACKAGING_REQUIRED: [409,"Move the job to packaging before dispatch readiness."], QC_NOT_PASSED: [409,"A latest passed quality inspection is required."],
      CUSTOM_BALANCE_DUE: [409,"Custom order balance must be fully paid before dispatch readiness."], INVALID_STAGE: [409,"That production stage transition is not allowed."], ORDER_STATE_CHANGED: [409,"The order changed while production was being completed. Refresh and review the order."]
    };
    const [status,message] = errors[code] || [500,"Could not update production job."];
    return NextResponse.json({ error: message }, { status });
  }
}
