import styled from "@emotion/styled";
import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Project from "@/components/Docs/Project";
import FetchProject from "@/components/FetchProject";

import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

export default function ProjectPage() {
  const { prj } = useParams();

  return (
    <>
      <Head>
        <title>py.wtf: {prj}</title>
      </Head>
      <FetchProject
        name={prj as string}
        content={(prj) => (
          <ContentWithSidebar sidebar={<Sidebar project={prj} />}>
            <Project prj={prj} />
          </ContentWithSidebar>
        )}
      />
    </>
  );
}
