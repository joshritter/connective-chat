import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "./UserAvatar";

const profile = { id: "u1", display_name: "Ada Lovelace", avatar_url: null };

describe("UserAvatar", () => {
  it("labels the fallback with the person's name", () => {
    render(<UserAvatar profile={profile} />);
    expect(screen.getByLabelText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows initials when there is no picture", () => {
    render(<UserAvatar profile={profile} />);
    expect(screen.getByLabelText("Ada Lovelace")).toHaveTextContent("AL");
  });

  it("copes with a missing profile", () => {
    render(<UserAvatar profile={null} />);
    expect(screen.getByLabelText("?")).toBeInTheDocument();
  });

  it("hides the presence dot when presence is not requested", () => {
    render(<UserAvatar profile={profile} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
