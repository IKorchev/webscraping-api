const express = require("express")
const cheerio = require("cheerio")
const puppeteer = require("puppeteer")
const port = process.env.port || 8000
const app = express()

const search = async (searchTerm) => {
  const url = `https://www.parfumo.net/s_perfumes.php?lt=1&filter=${searchTerm}`

  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const content = await page.goto(url).then(async () => page.content())
    const $ = cheerio.load(content)
    const perfumeGrid = $(".pgrid").find(".col")
    const objects = []

    perfumeGrid.each((i, el) => {
      const name = $(el).find(".name > a").text()
      const brand = $(el).find(".name > .brand > a").text()
      const imageUrl = $(el).find("img").attr("data-src")
      objects.push({
        name: `${brand} - ${name}`,
        imageUrl,
      })
    })
    await browser.close()

    return objects
  } catch (error) {
    console.log(error)
  }
}

app.get("/api/search/:searchTerm", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "s-max-age=10, stale-while-revalidate")
    const term = req.params.searchTerm
    const data = await search(term)
    res.json({ data: data })
  } catch (error) {
    res.status(500).send({ message: "internal server error" })
  }
})

app.listen(port, () => console.log("listening on port " + port))
module.exports = app