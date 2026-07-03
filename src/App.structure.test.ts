import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("App file organization", () => {
  const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

  it("defines no React components other than App", () => {
    const componentDefinitions = [
      ...appSource.matchAll(
        /^(?:export default )?function ([A-Z][A-Za-z0-9]*)\(/gm
      )
    ].map((match) => match[1])

    expect(componentDefinitions).toEqual(["App"])
  })

  it("does not use relative imports", () => {
    const relativeImports = [...appSource.matchAll(/from ["']\./g)].map(
      (match) => match[0]
    )

    expect(relativeImports).toEqual([])
  })
})
