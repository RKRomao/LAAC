FROM nginx:alpine

# Copy all static files to the nginx html directory
COPY . /usr/share/nginx/html/

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove the nginx.conf from the html directory (it was copied by the dot)
RUN rm /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/Dockerfile

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
