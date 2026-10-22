export function createClientCommandAdapter({ port, nextCommandToken }) {
  return Object.freeze({ issue: (kind, payload, model = port.getReadModel()) => {
    const c = model.context;
    const packet = { protocolVersion: c.protocolVersion, campaignId: c.campaignId, sessionId: c.sessionId,
      playerId: model.localPlayerId, commandId: `cmd:${nextCommandToken()}`, clientSequence: c.nextClientSequence,
      kind, payload: { ...payload }, spaceInstanceId: c.spaceInstanceId, spaceRevision: c.spaceRevision };
    if(c.residencyRevision!==undefined)packet.residencyRevision=c.residencyRevision;
    if(kind==='progression.change')packet.expectedSaveRevision=c.expectedSaveRevision;
    return port.send(packet);
  } });
}
