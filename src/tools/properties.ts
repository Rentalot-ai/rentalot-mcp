import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const STATUS_ENUM = ["active", "rented", "inactive", "maintenance", "draft", "archived"] as const;
const PET_POLICY_ENUM = ["allowed", "not-allowed", "negotiable"] as const;
const PARKING_ENUM = ["included", "available", "none"] as const;
const LAUNDRY_ENUM = ["in-unit", "in-building", "none"] as const;

export function registerPropertyTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_properties",
    "Use to list rental properties. Supports filtering by rent range, bedrooms, bathrooms, availability date, pet policy, parking, and city. Returns paginated results.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().max(100).optional().describe("Results per page (max 100)"),
      minRent: z.number().optional().describe("Minimum monthly rent"),
      maxRent: z.number().optional().describe("Maximum monthly rent"),
      minBedrooms: z.number().optional().describe("Minimum number of bedrooms"),
      minBathrooms: z.number().optional().describe("Minimum number of bathrooms"),
      availableBefore: z.string().optional().describe("Filter properties available before this date (ISO 8601 YYYY-MM-DD)"),
      petFriendly: z.boolean().optional().describe("Filter by pet-friendly properties"),
      hasParking: z.boolean().optional().describe("Filter by properties with parking"),
      city: z.string().optional().describe("Filter by city name"),
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
    "Use to get full details for a specific rental property by ID.",
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
    "Use to create a new rental property listing. Requires address, monthly rent, bedrooms, and bathrooms at minimum. Write operation — requires Pro tier or higher.",
    {
      address: z.string().describe("Street address of the property"),
      monthlyRent: z.number().describe("Monthly rent amount"),
      bedrooms: z.number().describe("Number of bedrooms"),
      bathrooms: z.number().describe("Number of bathrooms"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zip: z.string().optional().describe("ZIP code"),
      status: z.enum(STATUS_ENUM).optional().describe("Property status (default: active)"),
      description: z.string().optional().describe("Property description"),
      features: z.array(z.string()).optional().describe("List of property features"),
      availabilityDate: z.string().optional().describe("Availability date (ISO 8601 date string)"),
      petPolicy: z.enum(PET_POLICY_ENUM).optional().describe("Pet policy"),
      parking: z.enum(PARKING_ENUM).optional().describe("Parking availability"),
      laundry: z.enum(LAUNDRY_ENUM).optional().describe("Laundry availability"),
      imageUrls: z.array(z.string().max(2048).url()).min(1).max(20).optional().describe("Image URLs for the property (1–20 URIs)"),
      amenities: z.array(z.string().max(200)).max(50).optional().describe("List of amenities"),
      leaseMinMonths: z.number().int().min(1).max(120).optional().describe("Minimum lease term in months"),
      leaseMaxMonths: z.number().int().min(1).max(120).optional().describe("Maximum lease term in months"),
      moveInDate: z.string().optional().describe("Move-in date (ISO 8601 YYYY-MM-DD)"),
      depositAmount: z.number().int().min(0).max(1000000).optional().describe("Security deposit amount"),
      utilitiesIncluded: z.array(z.string().max(200)).max(20).optional().describe("List of included utilities"),
      squareFootage: z.number().int().min(1).max(1000000).optional().describe("Property size in square feet"),
      yearBuilt: z.number().int().min(1800).max(2026).optional().describe("Year the property was built"),
      neighborhoodDescription: z.string().max(2000).optional().describe("Description of the neighborhood"),
      url: z.string().max(2048).optional().describe("External listing URL"),
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

  server.tool(
    "update_property",
    "Use to update an existing property. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID to update"),
      address: z.string().optional().describe("Street address"),
      monthlyRent: z.number().optional().describe("Monthly rent amount"),
      bedrooms: z.number().optional().describe("Number of bedrooms"),
      bathrooms: z.number().optional().describe("Number of bathrooms"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zip: z.string().optional().describe("ZIP code"),
      status: z.enum(STATUS_ENUM).optional().describe("Property status"),
      description: z.string().optional().describe("Property description"),
      features: z.array(z.string()).optional().describe("List of property features"),
      availabilityDate: z.string().optional().describe("Availability date (ISO 8601 date string)"),
      petPolicy: z.enum(PET_POLICY_ENUM).optional().describe("Pet policy"),
      parking: z.enum(PARKING_ENUM).optional().describe("Parking availability"),
      laundry: z.enum(LAUNDRY_ENUM).optional().describe("Laundry availability"),
      amenities: z.array(z.string().max(200)).max(50).optional().describe("List of amenities"),
      leaseMinMonths: z.number().int().min(1).max(120).optional().describe("Minimum lease term in months"),
      leaseMaxMonths: z.number().int().min(1).max(120).optional().describe("Maximum lease term in months"),
      moveInDate: z.string().optional().describe("Move-in date (ISO 8601 YYYY-MM-DD)"),
      depositAmount: z.number().int().min(0).max(1000000).optional().describe("Security deposit amount"),
      utilitiesIncluded: z.array(z.string().max(200)).max(20).optional().describe("List of included utilities"),
      squareFootage: z.number().int().min(1).max(1000000).optional().describe("Property size in square feet"),
      yearBuilt: z.number().int().min(1800).max(2026).optional().describe("Year the property was built"),
      neighborhoodDescription: z.string().max(2000).optional().describe("Description of the neighborhood"),
      url: z.string().max(2048).optional().describe("External listing URL"),
      internalNotes: z.string().max(5000).optional().describe("Internal notes (not shown to prospects)"),
      isPublic: z.boolean().optional().describe("Whether the property is publicly listed"),
      ownerId: z.string().uuid().optional().describe("UUID of the property owner contact"),
    },
    async ({ propertyId, ...body }) => {
      const res = await api.patch(`/api/v1/properties/${propertyId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_property",
    "Use to permanently delete a property listing. This cannot be undone. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID to delete"),
    },
    async ({ propertyId }) => {
      const res = await api.delete(`/api/v1/properties/${propertyId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { deleted: true }, null, 2) }] };
    }
  );
}
