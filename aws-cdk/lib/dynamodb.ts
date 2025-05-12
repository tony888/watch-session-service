import * as cdk from "aws-cdk-lib";
import { AttributeType, Billing, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import env from "../config/env";

export class WatchSessionDB extends Construct {
  private _table: TableV2;

  public get table(): TableV2 {
    return this._table;
  }

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this._table = new TableV2(this, `watch-session-${env.ENV}`, {
      tableName: `watch-session-${env.ENV}`,
      billing: Billing.onDemand(),
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.initGSI();
  }

  private initGSI() {
    this.table.addGlobalSecondaryIndex({
      indexName: "ActiveSessions",
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "isActive",
        type: AttributeType.STRING,
      },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "SessionIdIndex",
      partitionKey: {
        name: "sessionId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "isActive",
        type: AttributeType.STRING,
      },
    });
  }
}
