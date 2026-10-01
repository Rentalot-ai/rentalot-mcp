import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/openapi.json"), "utf8"),
) as {
  components: { schemas: Record<string, { properties?: Record<string, Record<string, unknown>>; required?: string[] }> };
  paths: Record<string, { get?: { parameters?: Array<{ name: string; schema?: Record<string, unknown> }> } }>;
};

const PROPERTY_TYPES = ["house", "apartment", "condo", "townhouse", "room"];

describe("property OpenAPI contract", () => {
  it("requires a non-null output title and nullable canonical propertyType", () => {
    const property = fixture.components.schemas.Property;

    expect(property.properties?.title).toMatchObject({
      type: "string",
      example: "Downtown Loft",
    });
    expect(property.properties?.title).not.toHaveProperty("nullable");
    expect(property.required).toContain("title");
    expect(property.properties?.propertyType).toMatchObject({
      type: "string",
      nullable: true,
      enum: PROPERTY_TYPES,
    });
    expect(property.required).toContain("propertyType");
  });

  it("returns nullable unit and building fields without allowing buildingId on writes", () => {
    const property = fixture.components.schemas.Property;
    expect(property.properties?.unitNumber).toMatchObject({ type: "string", nullable: true });
    expect(property.properties?.buildingId).toMatchObject({ type: "string", nullable: true, format: "uuid" });
    expect(property.required).toEqual(expect.arrayContaining(["unitNumber", "buildingId"]));
    for (const schemaName of ["CreatePropertyRequest", "UpdatePropertyRequest"]) {
      const schema = fixture.components.schemas[schemaName];
      expect(schema.properties?.unitNumber).toMatchObject({ type: "string", nullable: true, maxLength: 50 });
      expect(schema.required ?? []).not.toContain("unitNumber");
      expect(schema.properties).not.toHaveProperty("buildingId");
    }
  });

  it("keeps title and propertyType optional on property writes", () => {
    for (const schemaName of ["CreatePropertyRequest", "UpdatePropertyRequest"]) {
      const schema = fixture.components.schemas[schemaName];
      expect(schema.properties?.title).toMatchObject({ type: "string", example: "Downtown Loft" });
      expect(schema.properties?.propertyType).toMatchObject({ type: "string", enum: PROPERTY_TYPES });
      expect(schema.required ?? []).not.toContain("title");
      expect(schema.required ?? []).not.toContain("propertyType");
    }
  });

  it("documents repeated propertyType filters and exact Studio filtering", () => {
    const parameters = fixture.paths["/api/v1/properties"].get?.parameters ?? [];
    const propertyType = parameters.find((parameter) => parameter.name === "propertyType");
    const bedroomType = parameters.find((parameter) => parameter.name === "bedroomType");

    expect(propertyType?.schema).toEqual({
      type: "array",
      items: { type: "string", enum: PROPERTY_TYPES },
    });
    expect(bedroomType?.schema).toEqual({ type: "string", enum: ["studio"] });
  });
});
