const express = require("express")
const search = require("./api/search")

const port = process.env.port || 8000
const app = express()

app.use("/api/search/", search)
app.listen(port, () => console.log("listening on port " + port))
