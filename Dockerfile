FROM node:18-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y git

# Install securelog-scan globally
RUN npm install -g securelog-scan

# Set the entrypoint
ENTRYPOINT ["securelog-scan"]