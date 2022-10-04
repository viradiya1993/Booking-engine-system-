import {
  Component,
  ComponentRef,
  ContentChild,
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";

@Directive({
  selector: "[appTooltip]",
})
export class TooltipDirective {
  private tooltipId: string;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {}

  @Input() parametroPlantilla: TemplateRef<any>;

  @ContentChild("tooltipTemplate")
  private tooltipTemplateRef: TemplateRef<Object>;

  @HostListener("mouseenter")
  @HostListener("touchstart")
  onMouseEnter(): void {
    const view = this.viewContainerRef.createEmbeddedView(
      this.tooltipTemplateRef
    );
    view.rootNodes.forEach((node) =>
      this.renderer.appendChild(this.elementRef.nativeElement, node)
    );
  }

  @HostListener("mouseleave")
  @HostListener("touchcancel")
  onMouseLeave(): void {
    if (this.viewContainerRef) {
      this.viewContainerRef.clear();
    }
  }
}
