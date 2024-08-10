"use client";

import { useState } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";

export const Verify = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleVerify = async (proof: ISuccessResult) => {
    const res = await fetch("/api/verify", {
      // route to your backend will depend on implementation
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proof),
    });
    if (!res.ok) {
      throw new Error("Verification failed."); // IDKit will display the error message to the user in the modal
    }
  };

  const onSuccess = () => {
    setIsVerified(true);
  };

  return (
    <>
      {isVerified ? (
        <div>Verified</div>
      ) : (
        <IDKitWidget
          app_id={
            (process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`) || ""
          }
          action="login" // obtained from the Developer Portal
          onSuccess={onSuccess} // callback when the modal is closed
          handleVerify={handleVerify} // callback when the proof is received
          verification_level={VerificationLevel.Orb}
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
      )}
    </>
  );
};
