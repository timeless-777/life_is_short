"use client";

import { useState } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import { verify } from "../api/actions/verify";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  type BaseError,
} from "wagmi";
import { CONTRACT_ADDRESS } from "../utils/config";
import abi from "../utils/abi/LifeIsShort.json";
import { Abi } from "viem";
import { injected } from "wagmi/connectors";
import Link from "next/link";

export const Verify = () => {
  const account = useAccount();
  const { connect } = useConnect();
  const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WLD_ACTION;

  if (!app_id) {
    throw new Error("app_id is not set in environment variables!");
  }
  if (!action) {
    throw new Error("action is not set in environment variables!");
  }

  const [hashed, setHashed] = useState<string>("");
  const [alreadyDisplayed, setAlreadyDisplayed] = useState<boolean | null>(null);

  const {
    data: hash,
    isPending,
    error,
    writeContractAsync,
    status,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mint = async () => {
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        account: account.address!,
        abi: abi as unknown as Abi,
        functionName: "safeMint",
        args: [account.address!, "1.json"],
      });
    } catch (error) {
      throw new Error((error as BaseError).shortMessage);
    }
  };

  const handleProof = async (result: ISuccessResult) => {
    console.log(
      "Proof received from IDKit, sending to backend:\n",
      JSON.stringify(result)
    );
    const data = await verify(result);
    if (data.success) {
      console.log("Successful response from backend:\n", JSON.stringify(data));
      setHashed(result.nullifier_hash);
    } else {
      throw new Error(`Verification failed: ${data.detail}`);
    }
  };

  const onSuccess = async () => {
    console.log(`hashed: ${hashed}`);
    if (!hashed) return;

    try {
      const userResponse: Response = await fetch(`/api/user/${hashed}`, {
        method: "GET",
      });
      const userData = await userResponse.json();
      console.log(`userData JSON: ${JSON.stringify(userData)}`);

      if (userData?.user?.worldId) {
        console.log("User exists, updating login...");

        if (userData.user && !userData.user.login) {
          const updateUserResponse = await fetch(
            `/api/user/${hashed}?login=true`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );
          console.log(
            `updateUserResponse: ${JSON.stringify(updateUserResponse)}`
          );
          if (!updateUserResponse.ok) {
            throw new Error("Failed to update user");
          }
        }
      } else {
        console.log("User does not exist, creating user...");
        const createUserResponse = await fetch(`/api/user/${hashed}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        console.log(
          `createUserResponse: ${JSON.stringify(createUserResponse)}`
        );

        if (!createUserResponse.ok) {
          throw new Error("Failed to create user");
        }
      }

      if (!userData.user || (userData && userData.user && !userData.user.login)) {
        setAlreadyDisplayed(false);
      } else {
        setAlreadyDisplayed(true);
      }
    } catch (error) {
      setAlreadyDisplayed(true);
      console.error("Error during onSuccess process:", error);
    }
  };

  const resetUser = async () => {
    const updateUserResponse = await fetch(`/api/user/${hashed}?login=false`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!updateUserResponse.ok) {
      throw new Error("Failed to update user");
    }
  };

  return (
    <>
      {alreadyDisplayed === false &&
        (account.isConnected ? (
          <div className="flex flex-col justify-center items-center">
            {status === "success" ? (
              <div className="flex flex-col justify-center items-center">
                <p className="text-2xl font-semibold">✅ Minted</p>
                <p className="text-2xl font-semibold">
                  Address 👉 {account.address}
                </p>
                <p>
                  Tx Hash 👉{" "}
                  <Link
                    href={`https://base-sepolia.blockscout.com/tx/${hash}`}
                    className="text-blue-500 underline"
                    target="_blank"
                  >
                    {hash}
                  </Link>
                </p>
              </div>
            ) : (
              <button
                onClick={mint}
                className="text-btn-text bg-btn-bg rounded-md px-8 py-4 text-2xl font-semibold"
              >
                Mint NFT
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center">
            <button
              onClick={() => connect({ connector: injected() })}
              className="text-btn-text bg-btn-bg rounded-md px-8 py-4 text-2xl font-semibold"
            >
              Connect Wallet
            </button>
          </div>
        ))}
      {alreadyDisplayed === null && (
        <div className="flex flex-col justify-center items-center">
          <IDKitWidget
            app_id={
              (process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`) || ""
            }
            action={(process.env.NEXT_PUBLIC_WLD_ACTION as string) || ""}
            onSuccess={onSuccess}
            handleVerify={handleProof}
            verification_level={VerificationLevel.Device}
          >
            {({ open }) => (
              <button
                onClick={open}
                className="text-btn-text bg-btn-bg rounded-md px-8 py-4 text-2xl font-semibold"
              >
                Verify with World ID
              </button>
            )}
          </IDKitWidget>
        </div>
      )}
      {alreadyDisplayed && (
        <div className="flex flex-col justify-center items-center">
          <p className="text-2xl font-semibold animate-fadeIn text-text-main">
            There won&apos;t be second time
          </p>
        </div>
      )}
      <button
        onClick={resetUser}
        className="text-btn-text px-4 py-2 text-lg font-semibold mt-16 absolute bottom-0 right-0 mb-4 mr-4"
      >
        Reset User
      </button>
    </>
  );
};
