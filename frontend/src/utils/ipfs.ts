import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA__GATEWAY_URL!,
});

const getMetadataFromIPFS = async (cid) => {
    const data = await pinata.gateways.get(cid);
    return data;
}

const uploadJson = async (json: string, filename: string) => {
    const blob = new Blob([json], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });
    const upload = await pinata.upload.file(file);
    return upload;
}

export {
    getMetadataFromIPFS,
    uploadJson
}