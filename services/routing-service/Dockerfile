# Use the official OSRM image
FROM osrm/osrm-backend:latest

# Add the map data file
# The user MUST place 'ghana-latest.osm.pbf' in this directory
COPY ./ghana-latest.osm.pbf /data/ghana-latest.osm.pbf

# Pre-process the data
# This will run *during the build* to create the routing graph
RUN osrm-extract -p /opt/car.lua /data/ghana-latest.osm.pbf && \
    osrm-partition /data/ghana-latest.osm.pbf && \
    osrm-customize /data/ghana-latest.osm.pbf

# The command to run the server on startup
CMD ["osrm-routed", "--algorithm", "mld", "/data/ghana-latest.osm.pbf"]
