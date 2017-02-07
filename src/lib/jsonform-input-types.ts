declare namespace jsonform {
    
    interface ITransloadItRenderData extends IRenderData {
        transloaditname?: string;
    }
    
    interface IImageSelectRenderData extends IRenderData {
        buttonTitle?: string;
        buttonClass?: string;
        prefix?: string;
        suffix?: string;
        width?: number;
        height?: number;
        columns?: number;
    }
    
    interface IIconSelectRenderData extends IRenderData {
        buttonTitle?: string;
        buttonClass?: string;
        columns?: number;
    }
    
    interface ICheckboxesRenderData extends IRenderData {
        choiceshtml?: string;
    }
    
    interface ITableObjectRenderData extends IRenderData {
        columnCount?: number;
        childMap?: {
            simple: string[];
            complex: string[];
        };
    }
    
    interface ITabRenderData extends IRenderData {
        tabs?: string;
    }
    
    interface ISelectFieldsetRenderData extends IRenderData {
        tabs?: string;
    }
    
}
