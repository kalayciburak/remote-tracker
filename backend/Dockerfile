FROM repo.mhrs.gov.tr/remotetracker/base/remote-tracker-backend-build:deps AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn -o -B -DskipTests -Dspotless.check.skip=true package

FROM repo.mhrs.gov.tr/remotetracker/base/eclipse-temurin:21-jre-wget
WORKDIR /app

COPY --from=build /app/target/remote-tracker.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
