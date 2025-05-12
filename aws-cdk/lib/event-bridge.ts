import { aws_events } from "aws-cdk-lib";
import { EventBus } from "aws-cdk-lib/aws-events";
import { Construct } from "constructs";
import env from "../config/env";

interface EventBridgeProps {
  bucketName: string;
}

export class EventBridge extends Construct {
  private props: EventBridgeProps;

  private _eventBus: EventBus;
  private _rule: aws_events.Rule;

  get eventBus() {
    return this._eventBus;
  }

  get rule() {
    return this._rule;
  }

  constructor(scope: Construct, id: string, props: EventBridgeProps) {
    super(scope, id);
    this.props = props;
    this.init();
  }

  private init() {
    this._eventBus = new EventBus(this, "watch-session-bus", {
      eventBusName: `watch-session-bus-${env.ENV}`,
      description: "Event bus for watch session service",
    });

    this._rule = new aws_events.Rule(this, "watch-session-file-created", {
      eventBus: this.eventBus,
      eventPattern: {
        detailType: ["Object Created"],
        source: ["aws.s3"],
        detail: {
          bucket: {
            name: [this.props.bucketName],
          },
        },
      },
    });
  }
}
