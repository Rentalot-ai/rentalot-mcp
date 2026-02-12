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
    "Use to list rental properties. Supports filtering by status, rent range, bedrooms, and city. Returns paginated results.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().max(100).optional().describe("Results per page (max 100)"),
      status: z.enum(STATUS_ENUM).optional().describe("Filter by property status"),
      minRent: z.number().optional().describe("Minimum monthly rent"),
      maxRent: z.number().optional().describe("Maximum monthly rent"),
      minBedrooms: z.number().optional().describe("Minimum number of bedrooms"),
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
