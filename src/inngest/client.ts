import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "mybookbuild" });

export type SourceCreatedEvent = {
    name: "source/created",
    data: {
        sourceId: string;
        workspaceId: string;
    }
}

export type ArtifactGenerateEvent = {
    name: "artifact/generate";
    data: {
        artifactId: string;
        workspaceId: string;
    };
};

export type InngestEvent =
    | SourceCreatedEvent
    | ArtifactGenerateEvent;

