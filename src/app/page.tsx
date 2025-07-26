"use client"; // NewsletterCreatorPage가 클라이언트 컴포넌트이므로 이 파일도 클라이언트 컴포넌트로 만듭니다.

import NewsletterCreatorPage from "@/app/newsletter/page";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function Home() {
  return (
    <>
      <NewsletterCreatorPage />
      <MadeWithDyad />
    </>
  );
}