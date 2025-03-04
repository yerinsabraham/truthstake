// src/constants/contracts.ts
import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

export const contractAddress = "0x65f27cbf6c13d3b900f4b8e725ca18f4ef7e2bc6";
export const tokenAddress = "0xD7AaA81D7166B8De1bC0F378eE641183864D0405";

export const contract = getContract({
    client: client,
    chain: sepolia,
    address: contractAddress
});

export const tokenContract = getContract({
    client: client,
    chain: sepolia,
    address: tokenAddress
});