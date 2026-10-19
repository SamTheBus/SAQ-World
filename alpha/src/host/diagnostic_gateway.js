import { validateWorldState } from "../shared/contracts/state.js";
import { validateCommand } from "../shared/contracts/commands.js";
import { validateCommandForState } from "../shared/contracts/command_context.js";
import { appliedClientSequence } from "../shared/contracts/history.js";
import { createCommandGatewayContracts } from "./command_gateway_core.js";

// Accepted B1 schemas remain the default, exclusively used by the playable host.
export const { createGatewayState, validateGatewayState, validateGatewayForState, admitDiagnosticCommand, retireAppliedAdmissions } =
  createCommandGatewayContracts({ validateWorldState, validateCommand, validateCommandForState, appliedClientSequence });
