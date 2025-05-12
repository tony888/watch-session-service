import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DefinitionBody, StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import env from "../config/env";

interface StepFunctionProps {
  lambda: NodejsFunction;
}

export class StepFunction extends Construct {
  private _stateMachine: StateMachine;

  get stateMachine() {
    return this._stateMachine;
  }

  constructor(
    scope: Construct,
    id: string,
    private props: StepFunctionProps,
  ) {
    super(scope, id);

    this.init();
  }

  private init() {
    const submitJob = new LambdaInvoke(this, "Submit Job", {
      lambdaFunction: this.props.lambda,
    });

    const definition = submitJob;

    this._stateMachine = new StateMachine(this, "StateMachine", {
      stateMachineName: `watch-session-state-machine-${env.ENV}`,
      definitionBody: DefinitionBody.fromChainable(definition),
    });
  }
}
