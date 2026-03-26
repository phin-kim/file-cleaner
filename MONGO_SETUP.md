# INSTALLING MONGO COMPASS

- Go to the official docs [https://www.mongodb.com/try/download/community-kubernetes-operator] for mongo db and search compass
- Download as msi
- Run the installer
- Finish the setup and open mongo compass

## Setting up the engine

- On first installation, this error is likely to occur `localhost:27017
connect ECONNREFUSED 127.0.0.1:27017, connect ECONNREFUSED ::1:27017`
  so the engine must be started
- In the setup ensure you have clicked "Run service a a network service user",<--- this should allow automatic startup
- So this is the procedure

### Procedure

**Option 1**

- press windows+R then search services.msc and scroll down to mongo server
- Check status if its blank, right click it and elect restart
- if running right click and selects restart
  **Option 2**
- MongoDb Server isn't in the services list`like mine` then it means it wasn't installed
- Check the path where it was installed for the bin
