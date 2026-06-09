import Lobby from "./[variant]/page";

// The poster's root link serves the demo lobby directly. nginx does the same by
// proxying "/" to the frontend's /demo page; this keeps direct dev-server access
// on "/" consistent too.
export default Lobby;
