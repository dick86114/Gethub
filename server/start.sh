#!/bin/sh

# 等待数据库就绪（可选，如果 docker-compose 设置了 healthcheck 或 depends_on 可以省略，但加上更稳健）
# 这里简单直接运行，Prisma 会重试连接

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Starting server..."
npm start
