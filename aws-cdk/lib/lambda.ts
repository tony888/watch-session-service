import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import "dotenv/config";
import env from "../config/env";

export class LambdaApp extends Construct {
  readonly MEMORY_SIZE = 1024 * 1; // 1GB
  readonly TIMEOUT = 60;

  private _lambda: NodejsFunction;

  public get lambda(): NodejsFunction {
    return this._lambda;
  }

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.init();
  }

  private init() {
    this._lambda = new NodejsFunction(this, "extract-watch-session-lambda", {
      functionName: `extract-watch-session-lambda-${env.ENV}`,
      entry: "lambda/index.ts",
      handler: "handler",
      memorySize: this.MEMORY_SIZE,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(this.TIMEOUT),
      environment: env as any,
    });
  }
}
