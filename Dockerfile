FROM mcr.microsoft.com/playwright:v1.62.0-jammy

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install Playwright browsers inside the image
RUN npx playwright install chromium

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
