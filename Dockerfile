# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Build TypeScript
RUN npm run build

# Copy source code
COPY src/ ./src/
COPY benchmarks/ ./benchmarks/
CMD ["node", "dist/app.js"] 