import { RoomsFilters } from "./RoomsFilters.pipe";

describe("FilterBasedOnStringPipe", () => {
  it("create an instance", () => {
    const pipe = new RoomsFilters();
    expect(pipe).toBeTruthy();
  });
});
