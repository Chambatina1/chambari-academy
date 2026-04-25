#!/bin/bash
set -e
echo "=== Starting build debug ===" > public/build-log.txt
echo "Node: $(node --version)" >> public/build-log.txt
echo "NPM: $(npm --version)" >> public/build-log.txt
echo "PWD: $(pwd)" >> public/build-log.txt
echo "Files: $(ls -la)" >> public/build-log.txt
echo "=== npm install ===" >> public/build-log.txt
npm install >> public/build-log.txt 2>&1 || { echo "NPM INSTALL FAILED" >> public/build-log.txt; exit 1; }
echo "=== prisma generate ===" >> public/build-log.txt
npx prisma generate >> public/build-log.txt 2>&1 || { echo "PRISMA GENERATE FAILED" >> public/build-log.txt; exit 1; }
echo "=== next build ===" >> public/build-log.txt
npx next build >> public/build-log.txt 2>&1 && echo "NEXT BUILD SUCCESS" >> public/build-log.txt || echo "NEXT BUILD FAILED" >> public/build-log.txt
echo "=== Build complete ===" >> public/build-log.txt
