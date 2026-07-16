import {
  getLightingPreviewSettings,
  type LightingMode,
  type LightingPreviewSettings,
  type StudioToneMapping,
} from "../client/src/scene/lightingConfig.ts";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Assert<Value extends true> = Value;

type LightingModeIsExact = Assert<
  Equal<LightingMode, "legacy" | "studio">
>;
type StudioToneMappingIsExact = Assert<
  Equal<StudioToneMapping, "agx" | "aces">
>;
type PreviewReturnIsExact = Assert<
  Equal<ReturnType<typeof getLightingPreviewSettings>, LightingPreviewSettings>
>;

export type {
  LightingModeIsExact,
  PreviewReturnIsExact,
  StudioToneMappingIsExact,
};
