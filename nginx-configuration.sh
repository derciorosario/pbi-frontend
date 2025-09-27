server {
  server_name www.54links.com 54links.com;
  root /var/www/pbi-frontend/dist;
  index index.html;

  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

  location / {
    # Try the requested URI first, fallback to index.html if not found
    # try_files $uri $uri/ =404;
    try_files $uri $uri/ /index.html;

    # Optional: Enable caching if needed by your application
    # proxy_cache_bypass $http_upgrade;

    # Set standard MIME types
    include /etc/nginx/mime.types;
  }

  client_max_body_size 10m;


    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/www.54links.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/www.54links.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}

server {
    if ($host = www.54links.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = 54links.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


  listen 80;
  server_name www.54links.com 54links.com;
    return 404; # managed by Certbot




}
