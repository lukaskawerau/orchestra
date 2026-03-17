import { describe, it, expect } from "vitest";
import { sanitizeKey } from "$lib/workspace/manager";

describe("Workspace Manager", () => {
  describe("sanitizeKey", () => {
    it("preserves valid characters", () => {
      expect(sanitizeKey("ORCH-123")).toBe("ORCH-123");
      expect(sanitizeKey("my_issue.test")).toBe("my_issue.test");
    });

    it("replaces invalid characters with underscore", () => {
      expect(sanitizeKey("issue/with/slashes")).toBe("issue_with_slashes");
      expect(sanitizeKey("issue with spaces")).toBe("issue_with_spaces");
      expect(sanitizeKey("issue:colon")).toBe("issue_colon");
    });

    it("handles empty string", () => {
      expect(sanitizeKey("")).toBe("");
    });
  });
});
