# Use buildx for multi-platform support
FROM --platform=$BUILDPLATFORM node:18-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y git

# Install securelog-scan globally
RUN npm install -g securelog-scan

# Make sure npm binaries are in PATH
ENV PATH="/usr/local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Set the entrypoint
ENTRYPOINT ["securelog-scan"]