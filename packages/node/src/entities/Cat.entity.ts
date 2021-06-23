// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize';

export function CatFactory(sequelize: Sequelize) {
  return sequelize.define('Cat', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    age: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    breed: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'updated_at'
    },
  }, {
    createdAt: true,
    updatedAt: true,
    underscored: true,
    schema: DEFAULT_DB_SCHEMA,
  });
}

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';