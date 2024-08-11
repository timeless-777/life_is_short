"use client";

import { useState, useEffect, useRef } from "react";
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
import abi from "../utils/abi/lifeIsShort.json";
import { Abi } from "viem";
import { injected } from "wagmi/connectors";
import Link from "next/link";
import Image from "next/image";

export const Verify = () => {
  const videoRef = useRef(null);
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
  const [alreadyDisplayed, setAlreadyDisplayed] = useState<boolean | null>(
    null
  );
  const [pageCount, setPageCount] = useState<number>(1);
  const [startCounting, setStartCounting] = useState<boolean>(false);
  const [selectedValue, setSelectedValue] = useState<number>(0);

  const [countdown, setCountdown] = useState<number>(0);

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

        if (userData.user && !userData.user.loginId) {
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

      if (
        !userData.user ||
        (userData && userData.user && !userData.user.loginId)
      ) {
        setAlreadyDisplayed(false);
      } else {
        setAlreadyDisplayed(true);
      }
    } catch (error) {
      setAlreadyDisplayed(true);
      console.error("Error during onSuccess process:", error);
    }
  };

  const choiceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, currentTarget } = e;
    const { offsetWidth, offsetLeft } = currentTarget;

    // クリック位置が画面の中央より左なら1、右なら2を設定
    if (clientX - offsetLeft < offsetWidth / 2) {
      setSelectedValue(1);
    } else {
      setSelectedValue(2);
    }
    setPageCount(5);
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

  useEffect(() => {
    if (startCounting) {
      const interval = setInterval(() => {
        setPageCount((prevPageCount) => {
          if (prevPageCount < 4) {
            return prevPageCount + 1;
          } else {
            clearInterval(interval);
            return prevPageCount;
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startCounting]);

  useEffect(() => {
    if (pageCount === 4) {
      // 3秒のカウントダウンを開始
      setCountdown(3);
      const intervalId = setInterval(() => {
        setCountdown((prev: number) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            clearInterval(intervalId);
            setCountdown(0);
            setPageCount(5); // 3秒後に関数を実行
            return 0;
          }
        });
      }, 1000);
    }
  }, [pageCount]);

  useEffect(() => {
    if (pageCount === 6) {
      const intervalId = setInterval(() => {
        setPageCount((prevCount) => {
          if (prevCount < 9) {
            return prevCount + 1;
          } else {
            clearInterval(intervalId);
            return prevCount;
          }
        });
      }, 1000);

      // Cleanup function to clear the interval if the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [pageCount]);

  return (
    <>
      {alreadyDisplayed === false &&
        (account.isConnected ? (
          <div className="flex flex-col justify-center items-center">
            {status === "success" ? (
              // <div className="flex flex-col justify-center items-center">
              //   <p className="text-2xl font-semibold">✅ Minted</p>
              //   <p className="text-2xl font-semibold">
              //     Address 👉 {account.address}
              //   </p>
              //   <p>
              //     Tx Hash 👉{" "}
              //     <Link
              //       href={`https://base-sepolia.blockscout.com/tx/${hash}`}
              //       className="text-blue-500 underline"
              //       target="_blank"
              //     >
              //       {hash}
              //     </Link>
              //   </p>
              // </div>
              <div className="h-full">
                <Image src="/img/success.png" alt="success" layout="fill" />
              </div>
            ) : pageCount === 1 ? (
              <div className="h-full">
                <Image
                  src="/img/page-1.png"
                  alt="page-1"
                  layout="fill"
                  onLoad={() => setStartCounting(true)} // 画像がロードされたらカウント開始
                />
              </div>
            ) : pageCount === 2 ? (
              <div className="h-full">
                <Image src="/img/page-2.png" alt="page-2" layout="fill" />
              </div>
            ) : pageCount === 3 ? (
              <div className="h-full">
                <Image src="/img/page-3.png" alt="page-3" layout="fill" />
              </div>
            ) : pageCount === 4 ? (
              <div>
                <div className="absolute top-0 left-0 right-0 text-center text-4xl font-bold">
                  {countdown}
                </div>
                <button className="h-full" onClick={(e) => choiceClick(e)}>
                  <Image
                    src="/img/choice.png"
                    alt="page-choice"
                    layout="fill"
                  />
                </button>
              </div>
            ) : pageCount === 5 ? (
              <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden">
                <video
                  ref={videoRef}
                  src="/video/train.mov"
                  autoPlay
                  muted
                  onEnded={() => setPageCount(6)}
                  className="w-full h-full object-cover"
                  playsInline
                />
              </div>
            ) : pageCount === 6 ? (
              <button className="h-full">
                <Image
                  src={`/img/answer-${selectedValue}.png`}
                  alt="answer"
                  layout="fill"
                />
              </button>
            ) : pageCount === 7 ? (
              <div className="h-full">
                <Image src="/img/result.png" alt="result" layout="fill" />
              </div>
            ) : pageCount === 8 ? (
              <div className="h-full relative">
                <Image
                  src={`/img/mint-${selectedValue}.png`}
                  alt="mint"
                  layout="fill"
                  className="object-cover"
                />
                <button
                  onClick={mint}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-btn-text bg-btn-bg rounded-md px-8 py-4 text-2xl font-semibold"
                >
                  Mint NFT
                </button>
              </div>
            ) : pageCount === 9 ? (
              <div className="h-full">
                <Image src="/img/success.png" alt="success" layout="fill" />
              </div>
            ) : (
              <p></p>
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
      {alreadyDisplayed === null &&
        (account.isConnected ? (
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
      {alreadyDisplayed && (
        <div className="flex flex-col justify-center items-center">
          <p className="text-2xl font-semibold animate-fadeIn text-text-main">
            There won&apos;t be second time
          </p>
        </div>
      )}
      <button
        onClick={resetUser}
        className="text-btn-text px-16 py-4 text-lg font-semibold mt-16 absolute bottom-0 right-0 mb-4 mr-4"
      ></button>
    </>
  );
};
