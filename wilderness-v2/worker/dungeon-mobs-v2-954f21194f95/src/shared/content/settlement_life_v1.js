import {freezeWire} from '../contracts/wire.js';
// Ordinary personal stock, not encounter rewards or Unique capacity. No restock
// clock: each gear offer is purchased once per actor; provisions are replenishable.
export const SETTLEMENT_LIFE_VERSION='settlement-life-candidate-v1';
export const SETTLEMENT_LIFE_HASH='4af4d3519fb954a5161c799771d79e69ced9955044fb690fc78e6333a3fec8c4';
export const SETTLEMENT_LIFE_POLICY=freezeWire({
 version:SETTLEMENT_LIFE_VERSION,interactionRadius:72,stockVersion:'ordinary-personal-stock-v1',
 pricingVersion:'ordinary-services-prices-v1',saleVersion:'ordinary-carried-sale-v1',
 supply:{id:'field-ration',label:'Field ration',price:'2',maximum:10,recoveryPercent:15},
 rest:{price:'5',effect:'Recover all missing HP. No time passes; no dungeon reset or resurrection.'},
 stockByRole:{
  general:[{id:'travel-boots',label:'Travel boots',family:'boots',definitionId:'sabatons',price:'12'},
   {id:'simple-ring',label:'Simple ring',family:'ring',definitionId:'copper-charm',price:'15'}],
  smith:[{id:'ordinary-weapon',label:'Ordinary weapon',family:'weapon',definitionId:'iron-sword',price:'18'},
   {id:'ordinary-armor',label:'Ordinary chest armor',family:'chest',definitionId:'padded-armor',price:'16'}]},
 stockLevelRule:'accepted-territory-minimum-level-1-6-11-21-41',gearPriceRule:'base-price-times-territory-band',bandSourceDepth:{1:1,2:20,3:40,4:80,5:160},gearRarity:0,
 sale:{baseGold:1,perItemPower:1,maximumRarity:5,maximumValuationPower:1000,perRarityTier:2,retainedReceiptBound:128,retirement:'after-authoritative-site-reward-archival-keep-durable-SOLD-page',
  excludes:['equipped','starter','provision','locked','protected','unique','artifact','sigil','unprovenanced']},
 recovery:'existing-exact-HP-arithmetic',timeSkipping:false,sharedStock:false,
 transactionFence:'actor-inventory-revision-and-normal-command-sequence',
 maximumPurchaseRecords:16,maximumRests:1000000,maximumSupplyPurchases:1000000
});
export const hasSettlementLife=b=>b?.settlementLifeVersion===SETTLEMENT_LIFE_VERSION&&b?.settlementLifeHash===SETTLEMENT_LIFE_HASH;
