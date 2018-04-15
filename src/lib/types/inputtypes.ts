import {IRenderData} from "./IRenderData";

export interface ITransloadItRenderData extends IRenderData {
    transloaditname?: string;
}

export interface IImageSelectRenderData extends IRenderData {
    buttonTitle?: string;
    buttonClass?: string;
    prefix?: string;
    suffix?: string;
    width?: number;
    height?: number;
    columns?: number;
}

export interface IIconSelectRenderData extends IRenderData {
    buttonTitle?: string;
    buttonClass?: string;
    columns?: number;
}

export interface ICheckboxesRenderData extends IRenderData {
    choiceshtml?: string;
}

export interface ITableObjectRenderData extends IRenderData {
    columnCount?: number;
    childMap?: {
        simple: string[];
        complex: string[];
    };
}

export interface ITabRenderData extends IRenderData {
    tabs?: string;
}

export interface ISelectFieldsetRenderData extends IRenderData {
    tabs?: string;
}
