FROM repo.mhrs.gov.tr/remotetracker/base/remote-tracker-frontend-build:deps AS build
WORKDIR /app

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

FROM repo.mhrs.gov.tr/remotetracker/base/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
