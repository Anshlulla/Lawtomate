import Vapi from "@vapi-ai/web";

export const vapi = new Vapi(process.env.REACT_APP_VAPI_API_KEY);
const assistantId = process.env.REACT_APP_ASSISTANT_ID;

export const startAssistant = async () => {
    const response = await vapi.start(assistantId);
    return response;
};

console.log(assistantId, vapi);

export const stopAssistant = () => {
    vapi.stop()
}