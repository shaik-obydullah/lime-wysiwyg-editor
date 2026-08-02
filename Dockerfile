FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql

WORKDIR /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/wysiwyg-entrypoint
RUN chmod +x /usr/local/bin/wysiwyg-entrypoint

ENTRYPOINT ["wysiwyg-entrypoint"]
CMD ["apache2-foreground"]
