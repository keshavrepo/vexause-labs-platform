# Enable HTTPS after DNS is ready

1. Set the real domain in `vexause.conf` and install the site in `/etc/nginx/sites-available/`.
2. Enable the site and verify `sudo nginx -t`.
3. Confirm A/AAAA DNS records point to the VPS. Do not publish an AAAA record unless IPv6 routing works.
4. Issue a certificate with Certbot's Nginx integration for the apex and `www` names.
5. Verify Certbot added the TLS server block and HTTP-to-HTTPS redirect. Review the generated configuration.
6. Confirm the site is reachable over HTTPS, then set `NEXT_PUBLIC_SITE_URL=https://your-domain` and `TRUSTED_ORIGINS=https://your-domain,https://www.your-domain` in `.env`.
7. Restart the app after changing environment variables.

Do not copy a placeholder domain into a live Nginx configuration. Keep SSH accessible while changing firewall rules. Enable HSTS only after HTTPS works reliably on the final domain.
