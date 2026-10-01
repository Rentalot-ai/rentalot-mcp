import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const STATUS_ENUM = ["active", "rented", "inactive", "archived"] as const;
const PROPERTY_TYPE_ENUM = ["house", "apartment", "condo", "townhouse", "room"] as const;
const PET_POLICY_ENUM = ["allowed", "not-allowed", "negotiable"] as const;
const PARKING_ENUM = ["included", "available", "none"] as const;
const LAUNDRY_ENUM = ["in-unit", "in-building", "none"] as const;

const updatePropertyInputShape = {
    propertyId: z.string().uuid().describe("The property UUID to update"),
    title: z.string().trim().min(1).max(500).optional().describe("Replacement property title"),
    address: z.string().trim().min(1).max(500).optional().describe("Street address"),
    unitNumber: z.string().max(50).nullable().optional().describe("Unit number (max 50 characters); null or blank clears it. When omitted, the API parses a trailing Unit/Apt/Suite/# suffix from the address"),
    monthlyRent: z.number().int().positive().max(1000000).optional().describe("Monthly rent amount"),
    bedrooms: z.number().int().nonnegative().max(50).optional().describe("Number of bedrooms"),
    propertyType: z.enum(PROPERTY_TYPE_ENUM).optional().describe("Canonical rental property type"),
    bathrooms: z.number().positive().max(50).optional().describe("Number of bathrooms"),
    city: z.string().max(200).optional().describe("City"),
    state: z.string().max(100).optional().describe("State"),
    zip: z.string().max(20).optional().describe("ZIP code"),
    status: z.enum(STATUS_ENUM).optional().describe("Property status"),
    description: z.string().max(5000).optional().describe("Property description"),
    features: z.array(z.string().max(200)).max(50).optional().describe("List of property features"),
    availabilityDate: z.string().date().optional().describe("Availability date (ISO 8601 date string)"),
    petPolicy: z.enum(PET_POLICY_ENUM).optional().describe("Pet policy"),
    parking: z.enum(PARKING_ENUM).optional().describe("Parking availability"),
    laundry: z.enum(LAUNDRY_ENUM).optional().describe("Laundry availability"),
    amenities: z.array(z.string().max(200)).max(50).optional().describe("List of amenities"),
    leaseMinMonths: z.number().int().min(1).max(120).optional().describe("Minimum lease term in months"),
    leaseMaxMonths: z.number().int().min(1).max(120).optional().describe("Maximum lease term in months"),
    moveInDate: z.string().date().optional().describe("Move-in date (ISO 8601 YYYY-MM-DD)"),
    depositAmount: z.number().int().min(0).max(1000000).optional().describe("Security deposit amount"),
    utilitiesIncluded: z.array(z.string().max(200)).max(50).optional().describe("List of included utilities"),
    squareFootage: z.number().int().min(1).max(1000000).optional().describe("Property size in square feet"),
    yearBuilt: z.number().int().min(1800).max(2026).optional().describe("Year the property was built"),
    neighborhoodDescription: z.string().max(2000).optional().describe("Description of the neighborhood"),
    url: z.string().url().max(2048).optional().describe("External listing URL"),
    internalNotes: z.string().max(5000).optional().describe("Internal notes (not shown to prospects)"),
    isPublic: z.boolean().optional().describe("Whether the property is publicly listed"),
    ownerId: z.string().uuid().optional().describe("UUID of the property owner contact"),
} as const;

const updatePropertyInputSchema = z
  .object(updatePropertyInputShape)
  .refine(
    (data) => Object.entries(data).some(([key, value]) => key !== "propertyId" && value !== undefined),
    { message: "At least one field must be provided for update" },
  );

export function registerPropertyTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_properties",
    "Use to list rental properties. Supports filtering by rent range, bedrooms, bathrooms, canonical property type, exact Studio layout, availability date, pet policy, parking, and city. Repeat propertyType values to match any selected type; use bedroomType=studio for listings with exactly bedrooms=0. Returns paginated results, including nullable unitNumber and read-only nullable buildingId (account-scoped building UUID grouping apartment/condo units). During the development-only trial, results are limited to private properties owned by the authenticated account.",
    {
      page: z.number().int().positive().optional().describe("Page number for pagination"),
      limit: z.number().int().positive().max(100).optional().describe("Results per page (max 100; trial requests are capped at 20)"),
      minRent: z.number().positive().optional().describe("Minimum monthly rent"),
      maxRent: z.number().positive().optional().describe("Maximum monthly rent"),
      minBedrooms: z.number().int().nonnegative().optional().describe("Minimum number of bedrooms"),
      propertyType: z.array(z.enum(PROPERTY_TYPE_ENUM)).min(1).optional().describe("Repeatable canonical rental property type filter"),
      bedroomType: z.enum(["studio"]).optional().describe("Exact bedroom layout; studio matches listings with bedrooms=0"),
      minBathrooms: z.number().positive().optional().describe("Minimum number of bathrooms"),
      availableBefore: z.string().date().optional().describe("Filter properties available before this date (ISO 8601 YYYY-MM-DD)"),
      petFriendly: z.boolean().optional().describe("Filter by pet-friendly properties"),
      hasParking: z.boolean().optional().describe("Filter by properties with parking"),
      city: z.string().max(200).optional().describe("Filter by city name"),
    },
    async (args) => {
      const res = await api.get("/api/v1/properties", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_property",
    "Use to get full details for a specific rental property by ID, including nullable unitNumber and read-only nullable buildingId (account-scoped building UUID grouping apartment/condo units). During the development-only trial, only private properties owned by the authenticated account are available.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
    },
    async ({ propertyId }) => {
      const res = await api.get(`/api/v1/properties/${propertyId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_property",
    "Use to create a new private rental property listing. Requires address, monthly rent, bedrooms, and bathrooms at minimum. Returns the property, including nullable unitNumber and read-only nullable buildingId (account-scoped building UUID grouping apartment/condo units). During the development-only trial, this is limited to private properties owned by the authenticated account. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
    {
      title: z.string().trim().min(1).max(500).optional().describe("Optional human-readable property title; when omitted, the API derives one from the address"),
      address: z.string().trim().min(1).max(500).describe("Street address of the property"),
      unitNumber: z.string().max(50).nullable().optional().describe("Unit number (max 50 characters); null or blank clears it. When omitted, the API parses a trailing Unit/Apt/Suite/# suffix from the address"),
      monthlyRent: z.number().int().positive().max(1000000).describe("Monthly rent amount"),
      bedrooms: z.number().int().nonnegative().max(50).describe("Number of bedrooms"),
      propertyType: z.enum(PROPERTY_TYPE_ENUM).optional().describe("Canonical rental property type; Studio is represented by bedrooms=0"),
      bathrooms: z.number().positive().max(50).describe("Number of bathrooms"),
      city: z.string().max(200).optional().describe("City"),
      state: z.string().max(100).optional().describe("State"),
      zip: z.string().max(20).optional().describe("ZIP code"),
      status: z.enum(STATUS_ENUM).optional().describe("Property status (default: active)"),
      description: z.string().max(5000).optional().describe("Property description"),
      features: z.array(z.string().max(200)).max(50).optional().describe("List of property features"),
      availabilityDate: z.string().date().optional().describe("Availability date (ISO 8601 date string)"),
      petPolicy: z.enum(PET_POLICY_ENUM).optional().describe("Pet policy"),
      parking: z.enum(PARKING_ENUM).optional().describe("Parking availability"),
      laundry: z.enum(LAUNDRY_ENUM).optional().describe("Laundry availability"),
      imageUrls: z.array(z.string().max(2048).url()).min(1).max(20).optional().describe("Image URLs for the property (1–20 URIs)"),
      amenities: z.array(z.string().max(200)).max(50).optional().describe("List of amenities"),
      leaseMinMonths: z.number().int().min(1).max(120).optional().describe("Minimum lease term in months"),
      leaseMaxMonths: z.number().int().min(1).max(120).optional().describe("Maximum lease term in months"),
      moveInDate: z.string().date().optional().describe("Move-in date (ISO 8601 YYYY-MM-DD)"),
      depositAmount: z.number().int().min(0).max(1000000).optional().describe("Security deposit amount"),
      utilitiesIncluded: z.array(z.string().max(200)).max(50).optional().describe("List of included utilities"),
      squareFootage: z.number().int().min(1).max(1000000).optional().describe("Property size in square feet"),
      yearBuilt: z.number().int().min(1800).max(2026).optional().describe("Year the property was built"),
      neighborhoodDescription: z.string().max(2000).optional().describe("Description of the neighborhood"),
      url: z.string().url().max(2048).optional().describe("External listing URL"),
      internalNotes: z.string().max(5000).optional().describe("Internal notes (not shown to prospects)"),
      isPublic: z.boolean().optional().describe("Whether the property is publicly listed"),
      ownerId: z.string().uuid().optional().describe("UUID of the property owner contact"),
    },
    async (args) => {
      const res = await api.post("/api/v1/properties", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.registerTool(
    "update_property",
    {
      description: "Use to update an existing private property. Only include fields you want to change. Returns the property, including nullable unitNumber and read-only nullable buildingId (account-scoped building UUID grouping apartment/condo units). During the development-only trial, updates are limited to private properties owned by the authenticated account. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
      inputSchema: updatePropertyInputShape,
    },
    async ({ propertyId, ...body }) => {
      const parsed = updatePropertyInputSchema.safeParse({ propertyId, ...body });
      if (!parsed.success) {
        return {
          content: [{ type: "text" as const, text: `Error: ${parsed.error.issues[0]?.message ?? "Invalid property update"}` }],
          isError: true,
        };
      }
      const { propertyId: parsedPropertyId, ...parsedBody } = parsed.data;
      const res = await api.patch(`/api/v1/properties/${parsedPropertyId}`, parsedBody);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_property",
    "Use to soft-delete a property listing. This marks it deleted and removes it from API results; it is not permanent erasure, and this MCP server does not expose a restore operation. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
    {
      propertyId: z.string().uuid().describe("The property UUID to delete"),
    },
    async ({ propertyId }) => {
      const res = await api.delete(`/api/v1/properties/${propertyId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: res.data ? JSON.stringify(res.data, null, 2) : "Property soft-deleted successfully." }] };
    }
  );
}
