type Id = number
interface Contacto { id: Id; nombre: string; telefono: string; email?: string }

const API = "http://localhost:3000/api/contacts"

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T | null
const must = <T extends HTMLElement>(el: T | null, name: string): T => { if (!el) throw new Error(name); return el }

const idInp = must($("#id") as HTMLInputElement | null, "#id") as HTMLInputElement
const nomInp = must($("#nombre") as HTMLInputElement | null, "#nombre") as HTMLInputElement
const telInp = must($("#telefono") as HTMLInputElement | null, "#telefono") as HTMLInputElement
const mailInp = must($("#email") as HTMLInputElement | null, "#email") as HTMLInputElement
const btnCrear = must($("#crear") as HTMLButtonElement | null, "#crear") as HTMLButtonElement
const btnAct = must($("#actualizar") as HTMLButtonElement | null, "#actualizar") as HTMLButtonElement
const btnLimpiar = must($("#limpiar") as HTMLButtonElement | null, "#limpiar") as HTMLButtonElement
const lista = must($("#lista") as HTMLTableSectionElement | null, "#lista") as HTMLTableSectionElement
const msg = must($("#msg") as HTMLDivElement | null, "#msg") as HTMLDivElement
const form = must(document.getElementById("form") as HTMLFormElement | null, "#form") as HTMLFormElement

function entero(v: string): number | null { const n = Number(v); if (!Number.isInteger(n) || n <= 0) return null; return n }
function limpiar(): void { form.reset(); idInp.focus() }
function mensaje(texto: string, tipo: "ok" | "error"): void {
  msg.textContent = texto
  msg.className = tipo === "ok" ? "ok" : "error"
  msg.style.display = "block"
  window.setTimeout(() => { msg.style.display = "none"; msg.textContent = ""; msg.className = "" }, 1800)
}

async function apiList(): Promise<Contacto[]> {
  const r = await fetch(API)
  if (!r.ok) throw new Error("api")
  return r.json()
}
async function apiCreate(c: Contacto): Promise<void> {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) })
  if (r.status === 409) throw new Error("ID duplicado")
  if (!r.ok) throw new Error("api")
}
async function apiUpdate(c: Contacto): Promise<void> {
  const r = await fetch(`${API}/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) })
  if (!r.ok) throw new Error("api")
}
async function apiDelete(id: Id): Promise<void> {
  const r = await fetch(`${API}/${id}`, { method: "DELETE" })
  if (!r.ok) throw new Error("api")
}

async function render(): Promise<void> {
  const arr = await apiList()
  lista.innerHTML = ""
  for (const c of arr.sort((a, b) => a.id - b.id)) {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nombre}</td>
      <td>${c.telefono}</td>
      <td>${c.email ?? ""}</td>
      <td>
        <button class="tbtn" data-editar="${c.id}">Editar</button>
        <button class="tbtn" data-eliminar="${c.id}">Eliminar</button>
      </td>`
    lista.appendChild(tr)
  }
}

function leerFormulario(): Contacto | null {
  const id = entero(idInp.value.trim())
  const nombre = nomInp.value.trim()
  const telefono = telInp.value.trim()
  const email = mailInp.value.trim()
  if (!id || nombre === "" || telefono === "") return null
  const c: Contacto = { id, nombre, telefono }
  if (email !== "") c.email = email
  return c
}

btnCrear.addEventListener("click", async () => {
  const c = leerFormulario()
  if (!c) { mensaje("Datos incompletos", "error"); return }
  try { await apiCreate(c); await render(); limpiar(); mensaje("Creado", "ok") }
  catch (e) { const m = (e as Error).message; mensaje(m === "ID duplicado" ? "ID duplicado" : "Error", "error") }
})

btnAct.addEventListener("click", async () => {
  const c = leerFormulario()
  if (!c) { mensaje("Datos incompletos", "error"); return }
  try { await apiUpdate(c); await render(); limpiar(); mensaje("Actualizado", "ok") }
  catch { mensaje("Error", "error") }
})

btnLimpiar.addEventListener("click", () => { limpiar() })

lista.addEventListener("click", async e => {
  const t = e.target as HTMLElement
  const eid = t.getAttribute("data-editar")
  const did = t.getAttribute("data-eliminar")
  if (eid) {
    const id = Number(eid)
    const arr = await apiList()
    const c = arr.find(x => x.id === id)
    if (!c) { mensaje("ID no existe", "error"); return }
    idInp.value = String(c.id)
    nomInp.value = c.nombre
    telInp.value = c.telefono
    mailInp.value = c.email ?? ""
    mensaje("Cargado para edición", "ok")
  } else if (did) {
    const id = Number(did)
    try { await apiDelete(id); await render(); mensaje("Eliminado", "ok") }
    catch { mensaje("Error", "error") }
  }
})

render()