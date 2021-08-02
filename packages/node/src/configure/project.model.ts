// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  loadProjectManifest,
  ProjectManifest,
  SubqlDataSource,
} from '@subquery/common';
import { ProjectNetwork } from '@subquery/common/project/models';
import { getLogger } from '../utils/logger';
import { prepareProjectDir } from '../utils/project';

const logger = getLogger('configure');

export class SubqueryProject implements ProjectManifest {
  static async create(path: string): Promise<SubqueryProject> {
    const projectPath = await prepareProjectDir(path);
    const project = new SubqueryProject();
    const source = loadProjectManifest(projectPath);
    Object.assign(project, source);
    project.path = projectPath;
    project.dataSources.map(function (dataSource) {
      if (!dataSource.startBlock || dataSource.startBlock < 1) {
        if (dataSource.startBlock < 1) logger.warn('start block changed to #1');
        dataSource.startBlock = 1;
      }
    });
    return project;
  }

  path: string;
  dataSources: SubqlDataSource[];
  description: string;
  network: ProjectNetwork;
  repository: string;
  schema: string;
  specVersion: string;
}
