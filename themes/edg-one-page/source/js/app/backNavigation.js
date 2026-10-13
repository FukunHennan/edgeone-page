import { onPageView } from "./lifecycle.js";
import initBackToPrevious from "../tools/backToPrevious.js";

onPageView(() => initBackToPrevious());
