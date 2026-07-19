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

type ExpectedPreviewSettings = {
  mode: "legacy" | "studio";
  toneMapping: "agx" | "aces";
  screensDormant: boolean;
  keyLightPosition: [number, number, number];
};
type LightingModeIsExact = Assert<
  Equal<LightingMode, "legacy" | "studio">
>;
type StudioToneMappingIsExact = Assert<
  Equal<StudioToneMapping, "agx" | "aces">
>;
type PreviewInterfaceIsExact = Assert<
  Equal<LightingPreviewSettings, ExpectedPreviewSettings>
>;
type PreviewReturnIsExact = Assert<
  Equal<ReturnType<typeof getLightingPreviewSettings>, ExpectedPreviewSettings>
>;

export type {
  LightingModeIsExact,
  PreviewInterfaceIsExact,
  PreviewReturnIsExact,
  StudioToneMappingIsExact,
};
