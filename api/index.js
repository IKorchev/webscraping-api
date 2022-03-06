const express = require("express")
const chromium = require("chrome-aws-lambda")
const cheerio = require("cheerio")
const puppeteer = require("puppeteer")
const port = process.env.port || 8000
const app = express()

const getTopFrags = async (gender) => {
  const url = `https://www.parfumo.net/Perfumes/Tops/${gender}`
  try {
    const browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()
    const content = await page.goto(url).then(async () => page.content())
    const $ = cheerio.load(content)
    const perfumeGrid = $(".pgrid").find(".col")
    const objects = []

    perfumeGrid.each((i, el) => {
      const place = $(el).find(".place").text()
      const name = $(el).find(".name > a").text()
      const brand = $(el).find(".name > .brand > a").text()
      const imageUrl = $(el).find("img").attr("data-src")
      objects.push({
        place: parseFloat(place),
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

const search = async (searchTerm) => {
  const url = `https://www.parfumo.net/s_perfumes.php?lt=1&filter=${searchTerm}`

  try {
    const browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()
    const content = await page.goto(url).then(async () => page.content())
    const $ = cheerio.load(content)
    const perfumeGrid = $(".pgrid").find(".col")
    const objects = []

    perfumeGrid.each((i, el) => {
      const name = $(el).find(".name > a").text()
      const brand = $(el).find(".name > .brand > a").text()
      const imageUrl = $(el).find("img").attr("data-src")
      const rating = $(el).find(".av_scent").text().trim().split(" ")[0]
      const totalVotes = $(el).find(".tv").text().trim()
      objects.push({
        name: `${brand} - ${name}`,
        imageUrl,
        rating,
        totalVotes,
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
app.get("/api/topfrags/:gender", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "s-max-age=10, stale-while-revalidate")
    const data = await getTopFrags(req.params.gender)
    res.json({ data: data })
  } catch (error) {
    res.status(500).send({ message: "internal server error" })
  }
})

app.listen(port, () => console.log("listening on port " + port))
module.exports = app
