import express from "express"
import cors from "cors"
import { promises as fs } from "fs"
import path from "path"
type Id = number
interface Contacto { id: Id; nombre: string; telefono: string; email?: string }
const app = express()
app.use(cors())
app.use(express.json())
const file = path.resolve("data/agenda.json")
async function leer(): Promise<Contacto[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as Contacto[] } catch { return [] }
}
async function escribir(arr: Contacto[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(arr, null, 2), "utf8")
}
app.get("/api/contacts", async (_req, res) => {
  res.json(await leer())
})
app.post("/api/contacts", async (req, res) => {
  const c = req.body as Contacto
  if (!Number.isInteger(c.id) || c.id <= 0 || !c.nombre || !c.telefono) return res.status(400).json({ error: "datos" })
  const arr = await leer()
  if (arr.some(x => x.id === c.id)) return res.status(409).json({ error: "duplicado" })
  arr.push(c)
  await escribir(arr)
  res.status(201).json(c)
})
app.put("/api/contacts/:id", async (req, res) => {
  const id = Number(req.params.id)
  const c = req.body as Contacto
  const arr = await leer()
  const i = arr.findIndex(x => x.id === id)
  if (i === -1) return res.status(404).json({ error: "noexiste" })
  arr[i] = { id, nombre: c.nombre, telefono: c.telefono, email: c.email }
  await escribir(arr)
  res.json(arr[i])
})
app.delete("/api/contacts/:id", async (req, res) => {
  const id = Number(req.params.id)
  const arr = await leer()
  const i = arr.findIndex(x => x.id === id)
  if (i === -1) return res.status(404).json({ error: "noexiste" })
  const del = arr.splice(i, 1)[0]
  await escribir(arr)
  res.json(del)
})
app.listen(3000)